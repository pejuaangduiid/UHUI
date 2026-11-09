package metrics

import "time"

var WIB = time.FixedZone("WIB", 7*3600)

type Clock interface {
	Now() time.Time
}

type RealClock struct{}

func (RealClock) Now() time.Time {
	return time.Now().In(WIB)
}

func Today(c Clock) time.Time {
	now := c.Now().In(WIB)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, WIB)
}

func Window30(today time.Time) (start, end time.Time) {
	todayWIB := today.In(WIB)
	start = time.Date(todayWIB.Year(), todayWIB.Month(), todayWIB.Day(), 0, 0, 0, 0, WIB).AddDate(0, 0, -29)
	end = time.Date(todayWIB.Year(), todayWIB.Month(), todayWIB.Day(), 23, 59, 59, 999999999, WIB)
	return start, end
}
