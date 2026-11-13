import { gracely } from "gracely"
import { pax2pay } from "@pax2pay/model-banking"
import * as dotenv from "dotenv"

dotenv.config()
export class Ledger {
	target?: string
	source?: string
	creditorIban: pax2pay.Rail.Address.Iban = {
		type: "iban",
		/* cspell: disable-next-line */
		iban: "GB33BUKB20201555555555",
		holder: "Upcheck Mock Creditor Ltd",
	}
	debtorAccount?: string
	ibanAmount = 0.01
	#accounts?: Promise<pax2pay.Account[] | undefined>
	get accounts(): Promise<pax2pay.Account[] | undefined> | undefined {
		return (this.#accounts ??= this.fetchAccounts())
	}
	fetchAccounts(): Promise<pax2pay.Account[] | undefined> | undefined {
		return this.client?.accounts
			.list()
			.then((r: any) =>
				Array.isArray(r) && r.length >= 2
					? r.filter(e => e.id == "OgyofcU8" || e.id == "4-ib_njC")
					: (console.log(r), undefined)
			)
	}
	constructor(public client?: pax2pay.Client) {}
	async createIban() {
		const accounts = await this.accounts
		if (accounts) {
			if ((accounts[0]?.balances?.GBP?.actual ?? 0) > (accounts[1]?.balances?.GBP?.actual ?? 0)) {
				this.debtorAccount = accounts[0].id
			} else {
				this.debtorAccount = accounts[1].id
			}
		}
		const transaction: pax2pay.Transaction.Creatable = {
			counterpart: this.creditorIban,
			currency: "GBP",
			amount: this.ibanAmount,
			description: "upcheck iban transaction",
		}
		const result = await this.client?.transactions.create(this.debtorAccount ?? "", transaction)
		console.log("createIban finished.")
		return result
	}
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
		const login = process.env.loginUrl ? pax2pay.Client.create(process.env.loginUrl, "") : undefined
		const token = ((await login?.me.login(process.env.email ?? "", process.env.password ?? "", "test")) ??
			gracely.client.unauthorized()) as any as gracely.Error | string
		const target = process.env.targetUrl || process.env.loginUrl
		const client = target ? pax2pay.Client.create(target, "") : undefined
		client && (client.realm = "test")
		/* cspell: disable-next-line */
		client && (client.organization = "upcheck")
		!gracely.Error.is(token) && client && (client.key = token)
		return new this(client)
	}
}
