import { gracely } from "gracely"
import { isoly } from "isoly"
import "isomorphic-fetch"
import { pax2pay } from "@pax2pay/model-banking"
import { userwidgets } from "@userwidgets/model"
import * as dotenv from "dotenv"

dotenv.config()

const client = process.env.url ? pax2pay.Client.create(process.env.url, "") : undefined
client && (client.realm = "test")
client && (client.organization = "Y2TgAgLN")
let token: string | gracely.Error
let accounts: pax2pay.Account[] | undefined
let target: string
let source: string

describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		const key = await client?.userwidgets.me.login({
			user: process.env.email ?? "",
			password: process.env.password ?? "",
		})
		token = userwidgets.User.Key.is(key) ? key.token : gracely.client.unauthorized()
		typeof token == "string" && client && (client.key = token)
		accounts = await client?.accounts.list().then(r => (gracely.Error.is(r) || r.length < 2 ? undefined : r))
	})
	it("get token", async () => {
		expect(typeof token == "string").toBeTruthy()
	})
	it("list accounts", async () => {
		expect(
			accounts &&
				!gracely.Error.is(accounts) &&
				accounts?.every(pax2pay.Account.is) &&
				accounts.map(a => (Balances.before = Balances.add(Balances.before, Balances.getAvailable(a.balances))))
		).toBeTruthy()
	})
	it("create internal", async () => {
		!accounts
			? undefined
			: (accounts?.[0]?.balances?.USD?.actual ?? 0) > (accounts?.[1]?.balances?.USD?.actual ?? 0)
			? ((source = accounts?.[0].id), (target = accounts?.[1].id))
			: ((source = accounts?.[1].id), (target = accounts?.[0].id))
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: { type: "internal", identifier: target },
			currency: "USD",
			amount: 100,
			description: "upcheck internal transaction",
		}
		const internal = await client?.transactions.create(source, transaction)
		expect(
			pax2pay.Transaction.is(internal) && (internal.status == "created" || internal.status == "processing")
		).toBeTruthy()
	})
	it("total balance constant", async () => {
		//await new Promise(resolve => setTimeout(resolve, 31000))
		const accounts = await client?.accounts.list()
		expect(
			accounts &&
				!gracely.Error.is(accounts) &&
				accounts?.every(pax2pay.Account.is) &&
				accounts.map(
					a =>
						(Balances.after = Balances.add(Balances.after, Balances.getAvailable(a.balances))) &&
						Balances.areEqual(Balances.before, Balances.after)
				)
		).toBeTruthy()
	}) // 60000
})

namespace Balances {
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
		for (const currency of isoly.Currency.types)
			result[currency] = isoly.Currency.add(currency, balance1[currency] ?? 0, balance2[currency] ?? 0)
		return result
	}
	export function areEqual(
		balance1: Partial<Record<isoly.Currency, number>>,
		balance2: Partial<Record<isoly.Currency, number>>
	): boolean {
		let result = false
		for (const currency of isoly.Currency.types)
			result = balance1[currency] == balance2[currency]
		return result
	}
}
