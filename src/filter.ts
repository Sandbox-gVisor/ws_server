import {TLog} from './log';

export type Filter = {
	applied: boolean;
	level: {
		debug: boolean;
		warning: boolean;
		info: boolean;
	};
	type: {
		enter: boolean;
		exit: boolean;
	};
	prefix: string;
	taskname: string;
	syscallname: string;
};

export const defaultFilter: Filter = {
	applied: false,
	level: {debug: true, warning: true, info: true},
	type: {enter: true, exit: true},
	prefix: '',
	taskname: '',
	syscallname: '',
};

const regexIsValid = (regex: string) => {
	try {
		new RegExp(regex);
		return true;
	} catch (error) {
		console.log('cant parse regex, ignore');
		return false;
	}
};

export function checkSuggest(log: TLog, filter: Filter) {
	// TODO not parse regex every check
	if (filter.prefix && regexIsValid(filter.prefix)) {
		const prefixRegex = new RegExp(filter.prefix);
		if (!prefixRegex.test(log.LogPrefix)) return false;
	}
	if (filter.taskname && regexIsValid(filter.taskname)) {
		const tasknameRegex = new RegExp(filter.taskname);
		if (!tasknameRegex.test(log.Taskname)) return false;
	}
	if (filter.syscallname && regexIsValid(filter.syscallname)) {
		const syscallnameRegex = new RegExp(filter.syscallname);
		if (!syscallnameRegex.test(log.Syscallname)) return false;
	}

	if (log.LogType == 'E') {
		if (!filter.type.enter) return false;
	} else {
		if (!filter.type.exit) return false;
	}

	if (log.level == 'info') {
		if (!filter.level.info) return false;
	} else if (log.level == 'debug') {
		if (!filter.level.debug) return false;
	} else if (log.level == 'warning') {
		if (!filter.level.warning) return false;
	}

	return true;
}
