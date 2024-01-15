export type TRval = {
	Retval: Array<string>;
	Err: string;
	Errno: string;
	Elapsed: string;
};

type TLogValue = {
	LogPrefix: string;
	LogType: string;
	Taskname: string;
	Syscallname: string;
	Output: Array<string>;
	Rval: TRval;
};

export type TMessage = {
	msg: TLogValue;
	level: string;
	time: string;
};

export type TLog = {
	LogPrefix: string;
	LogType: string;
	Taskname: string;
	Syscallname: string;
	Output: Array<string>;
	Rval: TRval;
	level: string;
	time: string;
};

export type TRowsCount = {
	rows: string
}

export type TDbLog = {
	id: number,
	message: TMessage
}

export function messageToLog(msg: TDbLog) {
	return {
		...msg.message.msg,
		level: msg.message.level,
		time: msg.message.time,
	};
}
