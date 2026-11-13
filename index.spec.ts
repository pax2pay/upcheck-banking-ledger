import { pax2pay } from "@pax2pay/model-banking"
import { Ledger } from "./Ledger"

let ledger: Ledger | undefined
let transactions: Record<"internal" | "iban", any>
describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		console.log("pax2pay Ledger.beforeAll started")
		const start = performance.now()
		ledger = await Ledger.open()
		const ledgerOpenTime = performance.now()
		console.log("pax2pay Ledger.beforeAll.Ledger.Open took: ", ledgerOpenTime - start)
		transactions = await Promise.all([ledger?.createInternal(), ledger?.createIban()]).then(t => ({
			internal: t[0],
			iban: t[1],
		}))
		console.log("pax2pay Ledger.beforeAll await transactions took: ", performance.now() - ledgerOpenTime)
	})
	it("create internal", async () => {
		const internal = transactions.internal
		const is = pax2pay.Transaction.type.is(internal) && pax2pay.Transaction.Status.Success.is(internal.status)
		!is &&
			console.log(
				"internal: ",
				JSON.stringify(internal, null, 2),
				...(!!internal && typeof internal === "object" && "posted" in internal
					? ["flaw: ", JSON.stringify(pax2pay.Transaction.type.flaw(internal), null, 2)]
					: [])
			)
		expect(is).toBeTruthy()
	})
	it("create iban", async () => {
		const iban = transactions.iban
		const is = pax2pay.Transaction.type.is(iban) && pax2pay.Transaction.Status.Success.is(iban.status)
		!is &&
			console.log(
				"iban: ",
				JSON.stringify(iban, null, 2),
				...(!!iban && typeof iban === "object" && "posted" in iban
					? ["flaw: ", JSON.stringify(pax2pay.Transaction.type.flaw(iban), null, 2)]
					: [])
			)
		expect(is).toBeTruthy()
	})
})
