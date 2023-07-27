import { Filter, defaultFilter } from "./filter";

export class Controller {
  pageSize: number;
  pageIndex: number;
  logs: Array<string>;
  len: number;
  filter: Filter;
  currentLength: number; // only for filter applyed

  redisClient: any;

  constructor(redisClient: any, size: number) {
    this.redisClient = redisClient;
    this.filter = defaultFilter;

    this.pageSize = size;
    this.pageIndex = 0;
    this.logs = [];
    this.len = 0;
    this.currentLength = 0;

    this.pull();
  }
  /** pull()
  * Read data, apply filters */
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
      this.currentLength = this.len;
    }
    fetchReq().catch(console.error)
  }

  emitData(socket: any) {
    socket.emit('data', this.logs);
  }

  emitLen(socket: any) {
    socket.emit("length", this.currentLength);
  }
}
