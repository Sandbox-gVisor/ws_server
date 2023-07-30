import {Filter, checkSuggest, defaultFilter} from './filter';
import {TLog, messageToLog} from './log';

export class Controller {
	pageSize: number;
	pageIndex: number;
	logs: Array<TLog>;
	len: number;
	filter: Filter;
	currentLength: number; // only for filter applied

	redisClient: any;

	constructor(redisClient: any, size: number) {
		this.redisClient = redisClient;
		this.filter = defaultFilter;

		this.pageSize = size;
		this.pageIndex = 0;
		this.logs = [];
		this.len = 0;
		this.currentLength = 0;
	}

	async setFilter(filter: Filter) {
		this.filter = filter;
		let newLen: number = 0;
		for (let i = 0; i < this.len; ++i) {
			const msg = await this.loadMsg('', i);
			if (!msg) continue;
			const log: TLog = messageToLog(msg);
			if (checkSuggest(log, this.filter)) {
				await this.redisClient.set('f' + newLen, JSON.stringify(msg));
				newLen++;
			}
		}
		this.currentLength = newLen;
	}

	async loadMsg(prefix: string, i: number) {
		const msg = await this.redisClient.get(prefix + i);
		return JSON.parse(msg);
	}

	async pull(prefix: string) {
		const start = this.pageIndex * this.pageSize;
		const finish = Math.min(start + this.pageSize, this.currentLength);

		let newLogs: Array<TLog> = [];
		for (let i = start; i < finish; ++i) {
			const msg = await this.loadMsg(prefix, i);
			if (msg) {
				newLogs.push(messageToLog(msg));
			} else {
				console.log("can't parse json");
			}
		}
		this.logs = newLogs;
	}

	/** pull()
	 * Read data, apply filters */
	async Pull() {
		if (this.filter.applied) {
			await this.pull('f');
		} else {
			await this.pull('');
		}
		console.log(this.currentLength);
	}

	async setPageSize(size: number) {
		this.pageSize = size;
		await this.Pull();
	}

	async setPageIndex(index: number) {
		this.pageIndex = index;
		await this.Pull();
	}

	async getLength() {
		this.len = await this.redisClient.get('length');
		this.currentLength = this.len;
	}

	async emitData(socket: any) {
		await this.Pull();
		this.emitLen(socket);
		socket.emit('data', this.logs);
	}

	emitLen(socket: any) {
		socket.emit('length', this.currentLength);
	}
}
