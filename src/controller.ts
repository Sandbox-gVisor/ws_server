import { Filter, checkSuggest, defaultFilter } from "./filter";
import { TLog, TMessege, messageToLog } from "./log";

export class Controller {
  pageSize: number;
  pageIndex: number;
  logs: Array<TLog>;
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

    this.Pull();
  }

  setFilter(filter: Filter) {
    this.filter = filter;
    const pullFunction = async () => {
      let newLen: number = 0;
      for (let i = 0; i < this.len; ++i) {
        const msgString = await this.redisClient.get('' + i);
        const log: TLog = messageToLog(JSON.parse(msgString));
        if (checkSuggest(log, this.filter)) {
          await this.redisClient.set("f" + newLen, msgString);
          newLen++;
        }
      }
      console.log("newLen = ", newLen);
      this.currentLength = newLen;
    };
    pullFunction().catch(console.error);
  }

  pull(prefix: string) {
    console.log("prefix = ", prefix);
    const start = this.pageIndex * this.pageSize;
    const pullFunction = async () => {
      let newLogs: Array<TLog> = [];
      for (let i = start; i < Math.min(start + this.pageSize, this.currentLength); ++i) {
        const logString = await this.redisClient.get(prefix + i);
        if (!JSON.parse(logString)) {
          continue;
        }
        const msg: TMessege = JSON.parse(logString);
        newLogs.push(messageToLog(msg));
      }
      this.logs = newLogs;
    };
    pullFunction().catch(console.error);
  }
  /** pull()
  * Read data, apply filters */
  Pull() {
    if (this.filter.applyed) {
      this.pull("f");
    } else {
      this.pull("");
      this.getLength();
    }
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.Pull();
  }

  setPageIndex(index: number) {
    this.pageIndex = index;
    this.Pull();
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
    this.emitLen(socket);
  }

  emitLen(socket: any) {
    socket.emit("length", this.currentLength);
  }
}
