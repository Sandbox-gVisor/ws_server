FROM golang:1.18.1

WORKDIR /app

COPY . ./

RUN go build

EXPOSE 6379

CMD ["./ws_server"]
