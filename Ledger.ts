import { gracely } from "gracely"
import { isoly } from "isoly"
import { pax2pay } from "@pax2pay/model-banking"
import { http } from "cloudly-http"
import * as dotenv from "dotenv"

dotenv.config()
export class Ledger {
	target?: string
	source?: string
	targetPaxgiro?: string
	sourcePaxgiro?: string
	#accounts?: Promise<pax2pay.Account[] | undefined>
	get accounts(): Promise<pax2pay.Account[] | undefined> | undefined {
		return (this.#accounts ??= this.client?.accounts
			.list()
			.then(r =>
				Array.isArray(r) && r.length >= 2
					? r.filter(e => e.id == "HyKIx45x" || e.id == "wIJxbBFE")
					: (console.log(r), undefined)
			))
	}
	constructor(public client?: pax2pay.Client) {}
	async clearbankHealth() {
		const response = await http.fetch({
			method: "GET",
			url: "https://banking.pax2pay.app/service/clearbank/signer/health",
			header: { realm: "uk" },
		})
		const body = await response.body
		console.log("clerbankHealth finished.")
		return { response, body }
	}
	async createPaxgiro() {
		let type: pax2pay.Rail.Address.Type = "paxgiro" as const
		const accounts = await this.accounts
		!accounts
			? undefined
			: (accounts?.[0]?.balances?.GBP?.actual ?? 0) > (accounts?.[1]?.balances?.GBP?.actual ?? 0)
			? ((this.sourcePaxgiro = accounts?.[0].id),
			  (this.targetPaxgiro =
					accounts?.[1].rails[0].type == "paxgiro"
						? accounts?.[1].rails[0].identifier
						: (accounts?.[1].id, (type = "internal"))))
			: ((this.sourcePaxgiro = accounts?.[1].id),
			  (this.targetPaxgiro =
					accounts?.[0].rails[0].type == "paxgiro"
						? accounts?.[0].rails[0].identifier
						: (accounts?.[0].id, (type = "internal"))))
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: { type, identifier: this.targetPaxgiro } as pax2pay.Rail.Address,
			currency: "GBP",
			amount: 20 * isoly.DateTime.getMinute(isoly.DateTime.now()) + 1,
			description: "upcheck paxgiro transaction",
		}
		const result = await this.client?.transactions.create(this.sourcePaxgiro ?? "", transaction)
		console.log("createPaggiro finished.")
		return result
	}
	async createInternal() {
		const accounts = await this.accounts
		!accounts
			? undefined
			: (accounts?.[0]?.balances?.GBP?.actual ?? 0) > (accounts?.[1]?.balances?.GBP?.actual ?? 0)
			? ((this.source = accounts?.[0].id), (this.target = accounts?.[1].id))
			: ((this.source = accounts?.[1].id), (this.target = accounts?.[0].id))
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: { type: "internal", identifier: this.target ?? "" },
			currency: "GBP",
			amount: 100,
			description: "upcheck internal transaction",
		}
		const result = await this.client?.transactions.create(this.source ?? "", transaction)
		console.log("createInternal finished.")
		return result
	}
	static async open(): Promise<Ledger> {
		const client = process.env.url ? pax2pay.Client.create(process.env.url, "") : undefined
		client && (client.realm = "test")
		/* cspell: disable-next-line */
		client && (client.organization = "agpiPo0v")
		const key = await client?.userwidgets("https://user.pax2pay.app", "https://dash.pax2pay.app").me.login({
			user: process.env.email ?? "",
			password: process.env.password ?? "",
		})
		const token = !gracely.Error.is(key) && key?.token ? key.token : gracely.client.unauthorized()
		!gracely.Error.is(token) && client && (client.key = token)
		return new this(client)
	}
}
