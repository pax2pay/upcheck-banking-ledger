import { gracely } from "gracely"
import { pax2pay } from "@pax2pay/model-banking"
import { Balances } from "./Balances"
import { Ledger } from "./Ledger"

let ledger: Ledger | undefined
let transactions: Record<"internal" | "paxgiro", any>
describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		console.log("pax2pay Ledger.beforeAll started")
		const start = performance.now()
		ledger = await Ledger.open()
		const ledgerOpenTime = performance.now()
		console.log("pax2pay Ledger.beforeAll.Ledger.Open took: ", ledgerOpenTime - start)
		transactions = await Promise.all([ledger?.createInternal(), ledger?.createPaxgiro()]).then(t => ({
			internal: t[0],
			paxgiro: t[1],
		}))
		console.log("pax2pay Ledger.beforeAll await transactions took: ", performance.now() - ledgerOpenTime)
	})
	it("create internal", async () => {
		const internal = transactions.internal
		const is =
			pax2pay.Transaction.type.is(internal) &&
			(internal.status == "review" || internal.status == "created" || internal.status == "processing")
		!is &&
			console.log(
				"internal: ",
				JSON.stringify(internal, null, 2),
				"flaw: ",
				JSON.stringify(pax2pay.Transaction.type.flaw(internal), null, 2)
			)
		expect(is).toBeTruthy()
	})
	it("create paxgiro", async () => {
		const paxgiro = transactions.paxgiro
		const is =
			pax2pay.Transaction.type.is(paxgiro) &&
			(paxgiro.status == "review" || paxgiro.status == "created" || paxgiro.status == "processing")
		!is &&
			console.log(
				"paxgiro: ",
				JSON.stringify(paxgiro, null, 2),
				"flaw: ",
				JSON.stringify(pax2pay.Transaction.type.flaw(paxgiro), null, 2)
			)
		expect(is).toBeTruthy()
	})
	it("total balance constant", async () => {
		const accounts = await ledger?.accounts
		expect(
			accounts &&
				!gracely.Error.is(accounts) &&
				accounts?.every(pax2pay.Account.type.is) &&
				accounts.map(
					a =>
						(Balances.after = Balances.add(Balances.after, Balances.getAvailable(a.balances))) &&
						Balances.areEqual(Balances.before, Balances.after)
				)
		).toBeTruthy()
	})
})
