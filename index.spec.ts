import { gracely } from "gracely"
import { isoly } from "isoly"
import "isomorphic-fetch"
import { pax2pay } from "@pax2pay/model-banking"
import { http } from "cloudly-http"
import * as dotenv from "dotenv"

dotenv.config()

jest.setTimeout(15000)
const client = process.env.url ? pax2pay.Client.create(process.env.url, "") : undefined
client && (client.realm = "test")
/* cspell: disable-next-line */
client && (client.organization = "agpiPo0v")
let token: string | gracely.Error
let accounts: pax2pay.Account[] | undefined
let target: string
let source: string
let targetPaxgiro: string
let sourcePaxgiro: string

describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		const key = await client?.userwidgets("https://user.pax2pay.app", "https://dash.pax2pay.app").me.login({
			user: process.env.email ?? "",
			password: process.env.password ?? "",
		})
		token = !gracely.Error.is(key) && key?.token ? key.token : gracely.client.unauthorized()
		!gracely.Error.is(token) && client && (client.key = token)
		accounts = await client?.accounts
			.list()
			.then(r =>
				gracely.Error.is(r) || typeof r == "undefined" || r.length < 2
					? undefined
					: r.filter(e => e.id == "HyKIx45x" || e.id == "wIJxbBFE")
			)
		console.log(
			`${
				typeof client == "undefined"
					? "client undefined"
					: gracely.Error.is(token)
					? "unauthorized"
					: `accounts: ${accounts}`
			}`
		)
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
			: (accounts?.[0]?.balances?.GBP?.actual ?? 0) > (accounts?.[1]?.balances?.GBP?.actual ?? 0)
			? ((source = accounts?.[0].id), (target = accounts?.[1].id))
			: ((source = accounts?.[1].id), (target = accounts?.[0].id))
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: { type: "internal", identifier: target },
			currency: "GBP",
			amount: 100,
			description: "upcheck internal transaction",
		}
		const internal = await client?.transactions.create(source, transaction)
		console.log("internal: ", internal)
		expect(
			pax2pay.Transaction.is(internal) && (internal.status == "created" || internal.status == "processing")
		).toBeTruthy()
	})
	it("create paxgiro", async () => {
		let type: pax2pay.Rail.Address.Type = "paxgiro" as const
		!accounts
			? undefined
			: (accounts?.[0]?.balances?.GBP?.actual ?? 0) > (accounts?.[1]?.balances?.GBP?.actual ?? 0)
			? ((sourcePaxgiro = accounts?.[0].id),
			  (targetPaxgiro =
					accounts?.[1].rails[0].type == "paxgiro"
						? accounts?.[1].rails[0].identifier
						: (accounts?.[1].id, (type = "internal"))))
			: ((sourcePaxgiro = accounts?.[1].id),
			  (targetPaxgiro =
					accounts?.[0].rails[0].type == "paxgiro"
						? accounts?.[0].rails[0].identifier
						: (accounts?.[0].id, (type = "internal"))))
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: { type, identifier: targetPaxgiro } as pax2pay.Rail.Address,
			currency: "GBP",
			amount: 20 * isoly.DateTime.getMinute(isoly.DateTime.now()),
			description: "upcheck paxgiro transaction",
		}
		const paxgiro = await client?.transactions.create(sourcePaxgiro, transaction)
		console.log("paxgiro: ", paxgiro)
		expect(
			pax2pay.Transaction.is(paxgiro) && (paxgiro.status == "created" || paxgiro.status == "processing")
		).toBeTruthy()
	})
	it("total balance constant", async () => {
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
	})
	it.each(["testUK", "uk"] as const)("Clearbank signer health", async realm => {
		const results = {
			testUK:
				"mJ8phBCco1Tm2jiHUDXXZVQM28SIz/kCaQ6xsYckvkwsjstMM8G1a2mrz/KtYl/yfOJOGVUQ8csJYe+WQ0fkM9RkHZo263e7fnDAEHdM+qqX0pMuQxQ+k3UwJltBpRGBYA4elXwVp3svPof0Utzse9VTFbVqIdg4loCyVQkVnPhyiLHmIDtiu/627Idm3SsCK2sydI6ebf5CrcmJVufLdqC0DoFgtd5mqr5K3AB1CVQY9v14KPNba/U6g0gBJGkfTA8M2F7H65WVG5H/2t5MMe1TxQ1GMds3ud4Upmo0YE8xZ45Qm1si+B7sPnQmz5Rnk+8CSebBOPiTumKCR62nNA==",
			uk: "EosDcM8deXNQb/5VGBpG1nA46t66zxWgYuSMJFAxjPyADcxHOmIP9ImkK+X3yZkPBx1TEeDijaytk1MouWQo85RHxd4N9LHKOrNaUqdZLsnjIH6E0hMSv8uqgeOFnWauuuICyRfgCNbuKUHc5Clijr4uAnJvmW1hw+q2FdVZU+jORHGT4hHqPgCp2d2cJsKzx8GemFy1achvihhhOGisLvDBaGULb3rac9C1n7RUdCEjYCh664uTuBY0DvqmRmKwdCk+/SsEDO2fUESVFE5Zh6VQOZfTXOBtjpPOKgh7e+tBUpBR/BISslUweUNflpH11prSvMjyTklA5jQFR/9rNg==",
		}
		const response = await http.fetch({
			method: "GET",
			url: "https://banking.pax2pay.app/service/clearbank/signer/health",
			header: { realm },
		})
		const body = await response.body
		response.status != 200 &&
			console.log(`Signer health response on ${realm}: `, JSON.stringify({ ...response, body }, null, 2))
		expect(body).toBe(results[realm])
	})
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
