package main

import "github.com/redis/go-redis/v9"

type Controller struct {
	PageSize    int
	PageIndex   int
	Logs        []Log
	Len         int
	CurrentLen  int
	Filter      Filter
	RedisClient redis.Client
}

func NewController(redisClient redis.Client, size int) *Controller {
	return &Controller{
		RedisClient:   redisClient,
		Filter:        Filter{},
		PageSize:      size,
		PageIndex:     0,
		Logs:          []Log{},
		Len:           0,
		CurrentLength: 0,
	}
}
