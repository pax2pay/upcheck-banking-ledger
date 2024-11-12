import { isoly } from "isoly"
import { pax2pay } from "@pax2pay/model-banking"

export namespace Balances {
	// eslint-disable-next-line prefer-const
	export let before: Partial<Record<isoly.Currency, number>> = {}
	// eslint-disable-next-line prefer-const
	export let after: Partial<Record<isoly.Currency, number>> = {}
	export function getActual(balances: pax2pay.Balances): Partial<Record<isoly.Currency, number>> {
		return Object.fromEntries(
			Object.entries(balances)
				.map(bEntry => [bEntry[0], bEntry[1].actual])
				.filter(cEntry => typeof cEntry[1] == "number")
		)
	}
	export function getReserved(balances: pax2pay.Balances): Partial<Record<isoly.Currency, number>> {
		return Object.fromEntries(
			Object.entries(balances).map(bEntry => [
				bEntry[0],
				(bEntry[1].outgoingReserved ?? 0) + (bEntry[1].incomingReserved ?? 0),
			])
		)
	}
	export function getAvailable(balances: pax2pay.Balances): Partial<Record<isoly.Currency, number>> {
		const a = getActual(balances)
		const r = getReserved(balances)
		return Object.fromEntries(
			(Object.entries(a) as [isoly.Currency, number][]).map(([key, value]) => [key, value - (r[key] ?? 0)])
		)
	}
	export function add(
		balance1: Partial<Record<isoly.Currency, number>>,
		balance2: Partial<Record<isoly.Currency, number>>
	): Partial<Record<isoly.Currency, number>> {
		const result: Partial<Record<isoly.Currency, number>> = {}
		;([...new Set([...Object.keys(balance1), ...Object.keys(balance2)]).values()] as isoly.Currency[]).forEach(
			currency => (result[currency] = isoly.Currency.add(currency, balance1[currency] ?? 0, balance2[currency] ?? 0))
		)
		return result
	}
	export function areEqual(
		balance1: Partial<Record<isoly.Currency, number>>,
		balance2: Partial<Record<isoly.Currency, number>>
	): boolean {
		return ([...new Set([...Object.keys(balance1), ...Object.keys(balance2)]).values()] as isoly.Currency[]).every(
			currency => balance1[currency] == balance2[currency]
		)
	}
}
