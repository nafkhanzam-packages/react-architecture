import moment from "moment";
import {numberToRoman, romanToNumber} from "big-roman";
import getAge from "get-age";

const toMoneyString = (value: number) => value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
const toDateString = (date: Date) => moment(date).utc(false).format("DD MMMM YYYY");
const toDateGQLString = (date: Date) => moment(date).utc(false).format("YYYY-MM-DD");
const toHourMinuteString = (date: Date) => moment(date).utc(false).format("HH:mm");
const toHourMinuteLocaleString = (date: Date) => moment(date).format("HH:mm");
const toHourMinuteGQLString = (date: Date) => moment(date).utc(false).format("HH:mm");
const toDateTimeGQLString = (date: Date) =>
  `${toDateGQLString(date)} ${toHourMinuteGQLString(date)}`;
const gqlToDate = (date: string) => moment(date, "YYYY-MM-DD").utc(true).toDate();
const gqlToTime = (time: string) => moment(time, "HH:mm[:ss]").utc(true).toDate();
const gqlToDateTime = (dateTime: string, time?: string) =>
  moment(`${dateTime}${time ? ` ${time}` : ""}`, "YYYY-MM-DD HH:mm[:ss]")
    .utc(true)
    .toDate();
const toRpString = (value: number) => `Rp ${toMoneyString(value)}`;
const toPricePerUnitString = (price: number, unit: string) => `${toRpString(price)} / ${unit}`;

export enum ErrorStatus {
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export const formats = {
  toMoneyString,
  toRpString,
  toRpPriceRange: (price: number, priceRange: number) =>
    priceRange
      ? `${toRpString(price - priceRange)} - ${toMoneyString(price + priceRange)}`
      : toRpString(price),
  toDateString,
  toHourMinuteString,
  toHourMinuteLocaleString,
  toHourMinuteGQLString,
  toDateGQLString,
  toDateTimeGQLString,
  toDateTimeString: (date: Date) => `Pukul ${toHourMinuteString(date)}, ${toDateString(date)}`,
  gqlToDate,
  gqlToTime,
  gqlToDateTime,
  toPricePerUnitString,
  toAge: (dateStr: string): number => getAge(dateStr),
  numberToRoman: (value: number): string => numberToRoman(value),
  romanToNumber: (str: string): number => romanToNumber(str),
  getGQLErrorStatus: (err: unknown): ErrorStatus => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (err as any)?.response?.errors?.[0]?.status as unknown;
      if (typeof status === "string" && (Object.values(ErrorStatus) as string[]).includes(status)) {
        return status as ErrorStatus;
      }
    } catch (_err) {}
    return ErrorStatus.UNKNOWN_ERROR;
  },
};

export const getErrMessage = (err: unknown) => {
  let title = "Error!";
  let msg = JSON.stringify(err);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg = (err as any)?.message ?? JSON.stringify(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gqlError = (err as any)?.response?.errors?.[0];
    if (gqlError) {
      msg = gqlError.message;
      title = gqlError.status ?? title;
    }
  } catch (error) {}
  return {title, msg};
};
