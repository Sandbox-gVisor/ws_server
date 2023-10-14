package main

type TRval struct {
	Retval  []string
	Err     string
	Errno   string
	Elapsed string
}

type TLogValue struct {
	LogPrefix   string
	LogType     string
	Taskname    string
	Syscallname string
	Output      []string
	Rval        TRval
}

type TMessage struct {
	Msg   TLogValue
	Level string
	Time  string
}

type TLog struct {
	LogPrefix   string
	LogType     string
	Taskname    string
	Syscallname string
	Output      []string
	Rval        TRval
	Level       string
	Time        string
}

func messageToLog(message TMessage) TLog {
	return TLog{
		LogPrefix:   message.Msg.LogPrefix,
		LogType:     message.Msg.LogType,
		Taskname:    message.Msg.Taskname,
		Syscallname: message.Msg.Syscallname,
		Output:      message.Msg.Output,
		Rval:        message.Msg.Rval,
		Level:       message.Level,
		Time:        message.Time,
	}
}
