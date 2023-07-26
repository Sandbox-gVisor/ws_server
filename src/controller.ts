import { RemoteSocket } from "socket.io";

export class Controller {
  pageSize: number;
  pageIndex: number;
  logs: Array<string>;
  len: number;

  redisClient: any;

  constructor(redisClient: any, size: number) {
    this.pageSize = size;
    this.pageIndex = 0;
    this.logs = [];
    this.redisClient = redisClient;
    this.len = 0;
    this.pull();
  }

  pull() {
    const pullFunction = async () => {
      let newLogs: Array<string> = [];
      const start = this.pageIndex * this.pageSize;
      for (let i = start; i < start + this.pageSize; ++i) {
        const log = await this.redisClient.get('' + i);
        newLogs.push(log);
      }
      this.logs = newLogs;
    };
    pullFunction().catch(console.error);
    this.getLength();
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.pull();
  }

  setPageIndex(index: number) {
    this.pageIndex = index;
    this.pull();
  }

  getLength() {
    const fetchReq = async () => {
      this.len = await this.redisClient.get("length")
    }
    fetchReq().catch(console.error)
  }

  emitData(socket: any) {
    const start = this.pageSize * this.pageIndex;
    for (let i = start; i < start + this.pageSize; ++i) {
      socket.emit('data', { index: i, log: this.logs[i - start] });
    }
  }
}
