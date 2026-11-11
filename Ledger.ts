import { gracely } from "gracely"
import { pax2pay } from "@pax2pay/model-banking"
import * as dotenv from "dotenv"

dotenv.config()
export class Ledger {
	target?: string
	source?: string
	#accounts?: Promise<pax2pay.Account[] | undefined>
	get accounts(): Promise<pax2pay.Account[] | undefined> | undefined {
		return (this.#accounts ??= this.client?.accounts
			.list()
			.then((r: any) =>
				Array.isArray(r) && r.length >= 2
					? r.filter(e => e.id == "OgyofcU8" || e.id == "4-ib_njC")
					: (console.log(r), undefined)
			))
	}
	constructor(public client?: pax2pay.Client) {}
	async createInternal() {
		const accounts = await this.accounts
		if (accounts) {
			if ((accounts?.[0]?.balances?.GBP?.actual ?? 0) > (accounts?.[1]?.balances?.GBP?.actual ?? 0)) {
				this.source = accounts?.[0].id
				this.target = accounts?.[1].id
			} else {
				this.source = accounts?.[1].id
				this.target = accounts?.[0].id
			}
		}
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
		client && (client.organization = "upcheck")
		const token = ((await client?.me.login(process.env.email ?? "", process.env.password ?? "", "test")) ??
			gracely.client.unauthorized()) as any as gracely.Error | string
		!gracely.Error.is(token) && client && (client.key = token)
		return new this(client)
	}
}
