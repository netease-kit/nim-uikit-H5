import { t } from "./i18n";

const padNumber = (value) => String(value).padStart(2, "0");

export const formatConversationTime = (timestamp, now = Date.now()) => {
  if (timestamp == null) {
    return "";
  }

  const current = new Date(timestamp);
  const reference = new Date(now);
  if (
    Number.isNaN(current.getTime()) ||
    Number.isNaN(reference.getTime())
  ) {
    return "";
  }

  const time = `${padNumber(current.getHours())}:${padNumber(
    current.getMinutes()
  )}`;
  const isCurrentDay =
    current.getFullYear() === reference.getFullYear() &&
    current.getMonth() === reference.getMonth() &&
    current.getDate() === reference.getDate();
  if (isCurrentDay) {
    return time;
  }

  const date = `${padNumber(current.getMonth() + 1)}-${padNumber(
    current.getDate()
  )}`;
  return current.getFullYear() === reference.getFullYear()
    ? `${date} ${time}`
    : `${current.getFullYear()}-${date} ${time}`;
};

export function caculateTimeago(dateTimeStamp) {
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const now = new Date().getTime();
  const diffValue = now - dateTimeStamp;
  let result = "";

  if (diffValue < 0) {
    return t("nowText");
  }
  const minC = Math.floor(diffValue / minute);
  const hourC = Math.floor(diffValue / hour);
  const dayC = Math.floor(diffValue / day);
  const weekC = Math.floor(diffValue / week);
  if (weekC >= 1 && weekC <= 4) {
    result = ` ${weekC}${t("weekText")}`;
  } else if (dayC >= 1 && dayC <= 6) {
    result = ` ${dayC}${t("dayText")}`;
  } else if (hourC >= 1 && hourC <= 23) {
    result = ` ${hourC}${t("hourText")}`;
  } else if (minC >= 1 && minC <= 59) {
    result = ` ${minC}${t("minuteText")}`;
  } else if (diffValue >= 0 && diffValue <= minute) {
    result = t("nowText");
  } else {
    const datetime = new Date();
    datetime.setTime(dateTimeStamp);
    const Nyear = datetime.getFullYear();
    const Nmonth =
      datetime.getMonth() + 1 < 10
        ? `0${datetime.getMonth() + 1}`
        : datetime.getMonth() + 1;
    const Ndate =
      datetime.getDate() < 10 ? `0${datetime.getDate()}` : datetime.getDate();
    result = `${Nyear}-${Nmonth}-${Ndate}`;
  }
  return result;
}

export const formatDateRange = (type) => {
  const date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (type === "start") {
    year = year - 100;
  }
  month = month > 9 ? month : "0" + month;
  day = day > 9 ? day : "0" + day;
  return `${year}-${month}-${day}`;
};
