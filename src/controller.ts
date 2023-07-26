
export class Controller {
  pageSize: number;
  pageIndex: number;
  logs: Array<string>;

  redisClient: any;

  constructor(redisClient: any, size: number) {
    this.pageSize = size;
    this.pageIndex = 0;
    this.logs = [];
    this.redisClient = redisClient;
    this.pull();
  }

  pull() {
    const pullFunction = async () => {
      let newLogs: Array<string> = [];
      const start = this.pageIndex * this.pageSize;
      for (let i = start; i < start + this.pageSize; ++i) {
        const log = await this.redisClient.get("" + i);
        newLogs.push(log);
      }
      this.logs = newLogs;
    }
    pullFunction().catch(console.error);
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.pull();
  }

  setPageIndex(index: number) {
    this.pageIndex = index;
    this.pull();
  }
};


