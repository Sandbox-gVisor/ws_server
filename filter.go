package main

import (
	"fmt"
	"regexp"
)

type FilterDto struct {
	Applied bool
	Level   struct {
		Debug   bool
		Warning bool
		Info    bool
	}
	Type struct {
		Enter bool
		Exit  bool
	}
	Prefix      string
	Taskname    string
	Syscallname string
}

type TFilter struct {
	Applied     bool
	Levels      []string
	Types       []string
	Prefix      regexp.Regexp
	Taskname    regexp.Regexp
	Syscallname regexp.Regexp
}

var defaultFilter = TFilter{
	Applied:     true,
	Levels:      []string{"debug", "info", "warning"},
	Types:       []string{"E", "X"},
	Prefix:      *regexp.MustCompile(""),
	Taskname:    *regexp.MustCompile(""),
	Syscallname: *regexp.MustCompile(""),
}

func regexIsValid(regex string) bool {
	_, err := regexp.Compile(regex)
	if err != nil {
		fmt.Println("can't parse regex, ignore")
		return false
	}

	return true
}

func toTFilter(dto FilterDto) TFilter {
	levels := []string{}
	types := []string{}

	if dto.Level.Info {
		levels = append(levels, "info")
	}
	if dto.Level.Debug {
		levels = append(levels, "debug")
	}
	if dto.Level.Warning {
		levels = append(levels, "warning")
	}
	if dto.Type.Exit {
		types = append(types, "X")
	}
	if dto.Type.Enter {
		types = append(types, "E")
	}
	if len(levels) == 0 {
		levels = []string{"info", "debug", "warning"}
	}
	if len(types) == 0 {
		types = []string{"E", "X"}
	}

	return TFilter{
		Applied:     dto.Applied,
		Levels:      levels,
		Types:       types,
		Prefix:      *regexp.MustCompile(dto.Prefix),
		Taskname:    *regexp.MustCompile(dto.Taskname),
		Syscallname: *regexp.MustCompile(dto.Syscallname),
	}
}

func checkSuggest(log TLog, filter TFilter) bool {
	return contains(filter.Levels, log.Level) &&
		contains(filter.Types, log.LogType) &&
		filter.Prefix.MatchString(log.LogPrefix) &&
		filter.Taskname.MatchString(log.Taskname) &&
		filter.Syscallname.MatchString(log.Syscallname)
}

func contains(arr []string, val string) bool {
	for _, item := range arr {
		if item == val {
			return true
		}
	}

	return false
}
