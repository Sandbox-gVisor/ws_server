FROM golang:1.18.1

WORKDIR /app

COPY . ./

RUN go build

EXPOSE 3001

CMD ["./ws_server"]
