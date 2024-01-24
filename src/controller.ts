import {
	TFilter,
	defaultFilter,
	FilterDto,
	toTFilter,
} from './filter';
import {TLog, messageToLog, TDbLog, TRowsCount} from './log';
import pg from "pg";

export class Controller {
	pageSize: number; // number of rows displayed on page
	pageIndex: number; // current page index
	logs: Array<TLog>; // messages from gvisor
	len: number;  // logs count
	filter: TFilter; // current filter
	currentLength: number; // logs count when filter applied

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

	/**
	 * setFilter sets new filter as current filter and then applies it
	 *
	 * @param filter
	 */
	async setFilter(filter: FilterDto) {
		this.filter = toTFilter(filter);

		await this.applyFilter()
	}

	/**
	 * applyFilter takes fields from current filter and then configures query to database
	 * start : index of the log in the database, starting from which messages should be pulled
	 * finish : index of the log in the database at which pulling should be finished
	 */
	async applyFilter() {
		const { levels, types, prefix, taskname, syscallname } = this.filter;
		const start = this.pageIndex * this.pageSize;
		const finish = Math.min(start + this.pageSize, this.currentLength);

		const query = `SELECT * 
                           	  FROM messages 
                           	  WHERE TRUE ${levels.length > 0 ? `AND message->>'level' IN ('${levels.join('\',\'')}')` : ''}
                                 ${types.length > 0 ? `AND message->'msg'->>'LogType' IN ('${types.join('\',\'')}')` : ''}
                                 ${prefix ? `AND message->'msg'->>'LogPrefix' ~ '${prefix.source === '\\/(?:)\\/' ? '' : prefix.source}'` : ''}
                                 ${taskname ? `AND message->'msg'->>'Taskname' ~ '${taskname.source === '\\/(?:)\\/' ? '' : taskname.source}'` : ''}
                                 ${syscallname ? `AND message->'msg'->>'Syscallname' ~ '${syscallname.source === '\\/(?:)\\/' ? '' : syscallname.source}'` : ''}
                              OFFSET ${start} LIMIT ${finish - start}`;

		await this.getDataFromDb(query)
	}

	/**
	 * 	getDataFromDb executes given query end saves logs in this.logs array
	 */
	async getDataFromDb(query : string){
		const dbLogs : Array<TDbLog> = await this.postgresClient.query(query).then(result => result.rows)
		const filteredLogs : Array<TLog> = []
		for (let i = 0; i < dbLogs.length; i++)
		{
			if (dbLogs[i].message == undefined) continue

			filteredLogs.push(messageToLog(dbLogs[i]))
		}

		this.logs = filteredLogs;
	}

	async pull() {
		const start = this.pageIndex * this.pageSize;
		const finish = Math.min(start + this.pageSize, this.currentLength);

		const query= `SELECT * 
							 FROM messages
						     OFFSET ${start} LIMIT ${finish - start}`
		await this.getDataFromDb(query)
	}

	/**
	 * 	Pull pulls all logs if current filter is not applied and pulls filtered logs otherwise
	 */
	async Pull() {
		if (this.filter.applied)
		{
			await this.applyFilter();
		}
		else
		{
			await this.pull();
		}
	}

	/**
	 *  setPageSize sets new current page size and then pulls logs
	 *
	 * @param size
	 */
	async setPageSize(size: number) {
		console.log("New page size: " + size)
		this.pageSize = size;

		await this.Pull();
	}

	/**
	 * setPageIndex sets new current page index and then pulls logs
	 * @param index
	 */
	async setPageIndex(index: number) {
		this.pageIndex = index;
		await this.Pull();
	}

	/**
	 * 	getLength makes query to find out number of the logs in the database
	 */
	async getLength() {
		const result : TRowsCount = await this.postgresClient.query(`SELECT COUNT(*) rows FROM messages`)
			.then(res => res.rows[0]);

		this.len = parseInt(result.rows, 10)
		this.currentLength = this.len;
	}

	/**
	 * 	emitData sends pulled logs to frontend
	 *
	 * @param socket
	 */
	async emitData(socket: any) {
		await this.Pull();
		this.emitLen(socket);
		socket.emit('data', this.logs);
	}

	/**
	 * 	emitLength sends currents logs number to the front
	 *
	 * @param socket
	 */
	emitLen(socket: any) {
		socket.emit('length', this.currentLength);
	}
}
