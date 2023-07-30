import {TLog} from './log';
import {type} from 'os';

export type FilterDto = {
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

export type TFilter = {
	applied: boolean;
	levels: Array<string>;
	types: Array<string>;
	prefix: RegExp;
	taskname: RegExp;
	syscallname: RegExp;
};

export const defaultFilter: TFilter = {
	applied: false,
	levels: ['debug', 'info', 'warning'],
	types: ['E', 'X'],
	prefix: new RegExp(''),
	taskname: new RegExp(''),
	syscallname: new RegExp(''),
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

export const toTFilter = (dto: FilterDto) => {
	let levels: string[] = [];
	let types: string[] = [];
	if (dto.level.info) levels.push('info');
	if (dto.level.debug) levels.push('debug');
	if (dto.level.warning) levels.push('warning');
	if (dto.type.exit) types.push('X');
	if (dto.type.enter) types.push('E');
	if (levels.length === 0) {
		levels = ['info', 'debug', 'warning'];
	}
	if (types.length === 0) {
		types = ['E', 'X'];
	}
	return {
		applied: dto.applied,
		levels: levels,
		types: types,
		prefix: regexIsValid(dto.prefix)
			? new RegExp(dto.prefix)
			: new RegExp(''),
		taskname: regexIsValid(dto.taskname)
			? new RegExp(dto.taskname)
			: new RegExp(''),
		syscallname: regexIsValid(dto.syscallname)
			? new RegExp(dto.syscallname)
			: new RegExp(''),
	};
};

export function checkSuggest(log: TLog, filter: TFilter) {
	return (
		filter.levels.includes(log.level) &&
		filter.types.includes(log.LogType) &&
		filter.prefix.test(log.LogPrefix) &&
		filter.taskname.test(log.Taskname) &&
		filter.syscallname.test(log.Syscallname)
	);
}
