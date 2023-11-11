package main

import (
	"context"
	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	_ "github.com/gorilla/mux"
	_ "github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"log"
	"net/http"
	"os"
)

func GinMiddleware(allowOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Content-Length, X-CSRF-Token, Token, session, Origin, Host, Connection, Accept-Encoding, Accept-Language, X-Requested-With")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Request.Header.Del("Origin")

		c.Next()
	}
}

var ctx = context.Background()

func main() {
	log.Println("Started ws_server!")

	router := gin.New()
	redisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_ADDR"),
	})

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatal("Couldn't connect to redis client: ", err)
	} else {
		log.Println("Successfully connected to Redis client!")
	}

	server := socketio.NewServer(nil)
	controller := NewController(*redisClient, 10)

	server.OnConnect("/", func(s socketio.Conn) error {
		log.Println("WebView connected!")
		controller.GetLength()
		log.Println(controller.PageSize, controller.CurrentLen)
		controller.Pull()
		controller.EmitData(s)

		return nil
	})

	server.OnEvent("/", "filter", func(s socketio.Conn, data FilterDto) {
		controller.SetFilter(data)
		controller.EmitData(s)
	})

	server.OnEvent("/", "set_page", func(s socketio.Conn, data int) {
		controller.SetPageIndex(data)
		controller.EmitData(s)
	})

	server.OnEvent("/", "set_size", func(s socketio.Conn, data int) {
		controller.SetPageSize(data)
		controller.EmitData(s)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		controller.Filter.Applied = false
		log.Println("Socket " + s.ID() + " disconnected!")
	})

	go func() {
		subscriber := redisClient.Subscribe(ctx, "update")
		defer subscriber.Close()

		_, err := subscriber.ReceiveMessage(ctx)
		if err != nil {
			log.Printf("Error receiving message: %v\n", err)
			return
		}

		controller.GetLength()
		server.ForEach("/", "", func(conn socketio.Conn) {
			controller.EmitLen(conn)
			controller.EmitData(conn)
		})
	}()

	go server.Serve()
	defer server.Close()

	router.Use(GinMiddleware("http://localhost:3000"))
	router.GET("/socket.io/*any", gin.WrapH(server))
	router.POST("/socket.io/*any", gin.WrapH(server))
	router.StaticFS("/public", http.Dir("../asset"))

	if err := router.Run(":3001"); err != nil {
		log.Fatal("failed run app: ", err)
	}
}
