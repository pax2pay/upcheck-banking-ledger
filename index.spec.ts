import { pax2pay } from "@pax2pay/model-banking"
import { Balances } from "./Balances"
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
		const is =
			pax2pay.Transaction.type.is(internal) &&
			(internal.status == "review" || internal.status == "created" || internal.status == "processing")
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
		const is =
			pax2pay.Transaction.type.is(iban) &&
			(iban.status == "review" || iban.status == "created" || iban.status == "processing")
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
	it("total balance only less iban amount", async () => {
		const accounts = pax2pay.Account.typeZod.array().length(2)
		const before = accounts.safeParse(await ledger?.accounts)
		const after = accounts.safeParse(await ledger?.fetchAccounts())
		const debited =
			pax2pay.Transaction.type.is(transactions.iban) && typeof transactions.iban.status == "string"
				? (ledger?.ibanAmount ?? 0)
				: 0
		expect(before.success && after.success).toBe(true)
		before.success &&
			after.success &&
			expect(Balances.total(after.data)).toEqual(Balances.add(Balances.total(before.data), { GBP: -debited }))
	})
})
