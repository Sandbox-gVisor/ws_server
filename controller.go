package main

import (
	"context"
	"encoding/json"
	"fmt"
	socketio "github.com/googollee/go-socket.io"
	"github.com/redis/go-redis/v9"
	"strconv"
)

type Controller struct {
	PageSize    int
	PageIndex   int
	Logs        []TLog
	Len         int
	CurrentLen  int
	Filter      TFilter
	RedisClient redis.Client
	Ctx         context.Context
}

func NewController(redisClient redis.Client, size int) *Controller {
	return &Controller{
		RedisClient: redisClient,
		Filter:      TFilter{},
		PageSize:    size,
		PageIndex:   0,
		Logs:        []TLog{},
		Len:         0,
		CurrentLen:  0,
		Ctx:         context.Background(),
	}
}

func (c *Controller) LoadMsg(prefix string, i int) (TMessage, error) {
	var logs TMessage

	msg := c.RedisClient.Get(c.Ctx, prefix+strconv.Itoa(i))
	err := json.Unmarshal([]byte(msg.String()), &logs)
	if err != nil {
		return TMessage{}, err
	}

	return logs, nil
}

// SetFilter TODO: make messageToLog async
func (c *Controller) SetFilter(filter FilterDto) {
	c.Filter = toTFilter(filter)

	newLen := 0
	for i := 0; i < c.Len; i++ {
		msg, err := c.LoadMsg("", i) // this must be async
		if err != nil {
			continue
		}

		log := messageToLog(msg)
		if checkSuggest(log, c.Filter) {
			jsonstring, err := json.Marshal(msg)
			if err == nil {
				c.RedisClient.Set(c.Ctx, strconv.Itoa('f'+newLen), string(jsonstring), 0)
				newLen++
			}
		}
	}
	c.CurrentLen = newLen
}

func (c *Controller) pull(prefix string) {
	start := c.PageIndex * c.PageSize
	finish := min(start+c.PageSize, c.CurrentLen)

	var newLogs []TLog
	for i := start; i < finish; i++ {
		msg, err := c.LoadMsg(prefix, i)
		if err != nil {
			fmt.Println("can't parse json")
			continue
		}
		newLogs = append(newLogs, messageToLog(msg))
	}
	c.Logs = newLogs
}

func (c *Controller) Pull() {
	if c.Filter.Applied {
		c.pull("f")
	} else {
		c.pull("")
	}
}

func (c *Controller) SetPageSize(size int) {
	c.PageSize = size
	c.Pull()
}

func (c *Controller) SetPageIndex(index int) {
	c.PageIndex = index
	c.Pull()
}

func (c *Controller) GetLength() {
	c.Len, _ = c.RedisClient.Get(c.Ctx, "length").Int()
	c.CurrentLen = c.Len
}

func (c *Controller) EmitData(socket socketio.Conn) {
	c.Pull()
	c.EmitLen(socket)
	socket.Emit("data", c.Logs)
}

func (c *Controller) EmitLen(socket socketio.Conn) {
	socket.Emit("length", c.CurrentLen)
}

func min(a, b int) int {
	if a < b {
		return a
	}

	return b
}
