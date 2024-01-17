import {
	TFilter,
	checkSuggest,
	defaultFilter,
	FilterDto,
	toTFilter,
} from './filter';
import {TLog, messageToLog, TDbLog, TRowsCount} from './log';
import pg from "pg";

export class Controller {
	pageSize: number;
	pageIndex: number;
	logs: Array<TLog>;
	len: number;  // logs count
	filter: TFilter;
	currentLength: number; // only for filter applied

	postgresClient: pg.Client;

	constructor(postgresClient: any, size: number) {
		this.postgresClient = postgresClient;
		this.filter = defaultFilter;

		this.pageSize = size;
		this.pageIndex = 0;
		this.logs = [];
		this.len = 0;
		this.currentLength = 0;
	}

	// in key-value realization of this func we were picking each log from storage, then
	// converting them into TLog and checking whether the log was fitting the current filter
	async applyFilter(filter: FilterDto, socket: any) {
		this.filter = toTFilter(filter);
		const { levels, types, prefix, taskname, syscallname } = this.filter;
		const start = this.pageIndex * this.pageSize;
		const finish = Math.min(start + this.pageSize, this.currentLength);

		const query = `SELECT * 
                           	  FROM messages 
                           	  WHERE TRUE ${levels.length > 0 ? `AND message->>'level' IN ('${levels.join('\',\'')}')` : ''}
                                 ${types.length > 0 ? `AND message->'msg'->>'LogType' IN ('${types.join('\',\'')}')` : ''}
                                 ${prefix ? `AND message->'msg'->>'LogPrefix' ~ '${prefix.source === '\\/(?:)\\/' ? '' : prefix.source}'` : ''}
                                 ${taskname ? `AND message->'msg'->>'Taskname' ~ '${taskname.source === '\\/(?:)\\/' ? '' : taskname.source}'` : ''}
                                 ${syscallname ? `AND message->'msg'->>'Syscallname' ~ '${syscallname.source === '\\/(?:)\\/' ? '' : syscallname.source}'` : ''}`;

		/*const dbLogs : TDbLog = await this.postgresClient.query(query).then(result => {
			result.rows.forEach(row => {
				delete row.id
			})

			this.logs = result.rows;
			this.currentLength = <number>result.rowCount
		});*/

		const dbLogs : Array<TDbLog> = await this.postgresClient.query(query).then(result => result.rows)
		const filteredLogs : Array<TLog> = []
		for (let i = start; i < finish; ++i)
		{
			if (i == 0) continue

			filteredLogs.push(messageToLog(dbLogs[i]))
		}

		this.logs = filteredLogs;
		this.emitLen(socket);
		socket.emit('data', this.logs);
	}

	// loadMsg gets logs from database by row's index
	async loadMsg(i: number) {
		const msg : TDbLog = await this.postgresClient.query('SELECT * FROM messages WHERE id = $1', [i])
			.then(res => res.rows[0])

		return msg
	}

	async pull() {
		const start = this.pageIndex * this.pageSize;
		const finish = Math.min(start + this.pageSize, this.currentLength);

		let newLogs: Array<TLog> = [];
		for (let i = start; i < finish; ++i) {
			if (i == 0) continue

			const msg = await this.loadMsg(i);
			if (msg) {
				newLogs.push(messageToLog(msg));
			} else {
				console.log("can't parse json:");
				console.log(msg)
			}
		}
		this.logs = newLogs;
	}

	/** pull()
	 * Read data, apply filters */
	async Pull() {
		await this.pull();
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
		const result : TRowsCount = await this.postgresClient.query(`SELECT COUNT(*) rows FROM messages`)
			.then(res => res.rows[0]);

		this.len = parseInt(result.rows, 10)
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
