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

export function messageToLog(message: TMessage) {
	return {
		...message.msg,
		level: message.level,
		time: message.time,
	};
}
