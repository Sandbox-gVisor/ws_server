import { TLog } from "./log";

export type Filter = {
  applyed: boolean;
  level: {
    debug: boolean,
    warning: boolean,
    info: boolean,
  },
  type: {
    enter: boolean,
    exit: boolean,
  },
  prefix: string,
  taskname: string,
  syscallname: string,
};

export const defaultFilter: Filter = {
  applyed: false,
  level: { debug: true, warning: true, info: true },
  type: { enter: true, exit: true },
  prefix: "",
  taskname: "",
  syscallname: ""
};

export function checkSuggest(log: TLog, filter: Filter) {
  if (!filter.applyed) return true;
  const prefixRegex = new RegExp(filter.prefix);
  const tasknameRegex = new RegExp(filter.taskname);
  const syscallnameRegex = new RegExp(filter.syscallname);

  if (filter.prefix && !prefixRegex.test(log.LogPrefix)) return false;
  if (filter.taskname && !tasknameRegex.test(log.Taskname)) return false;
  if (filter.syscallname && !syscallnameRegex.test(log.Syscallname)) return false;

  if (log.LogType == "E") {
    if (!filter.type.enter) return false;
  } else {
    if (!filter.type.exit) return false;
  }

  if (log.level == "info") {
    if (!filter.level.info) return false;
  } else if (log.level == "debug") {
    if (!filter.level.debug) return false;
  } else if (log.level == "warning") {
    if (!filter.level.warning) return false;
  }

  return true;
}
