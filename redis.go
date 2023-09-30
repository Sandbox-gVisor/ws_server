package main

import (
	"context"
	"github.com/redis/go-redis/v9"
	"log"
	"os"
)

type Redis struct {
	RedisClient redis.Client
	ctx         context.Context
}

func (r *Redis) Init() {
	r.RedisClient = *redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: "",
	})
	r.ctx = context.Background()

	_, err := r.RedisClient.Ping(r.ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
}
