import { gracely } from "gracely"
import { pax2pay } from "@pax2pay/model-banking"
import { Balances } from "./Balances"
import { Ledger } from "./Ledger"

let ledger: Ledger | undefined
let transactions: Record<"internal" | "paxgiro" | "clearbank", any>
describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		ledger = await Ledger.open()
		transactions = await Promise.all([
			ledger?.createInternal(),
			ledger?.createPaxgiro(),
			ledger?.clearbankHealth(),
		]).then(t => ({ internal: t[0], paxgiro: t[1], clearbank: t[2] }))
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
		expect(!is).toBeTruthy()
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
	it("Clearbank signer health", async () => {
		const result =
			"EosDcM8deXNQb/5VGBpG1nA46t66zxWgYuSMJFAxjPyADcxHOmIP9ImkK+X3yZkPBx1TEeDijaytk1MouWQo85RHxd4N9LHKOrNaUqdZLsnjIH6E0hMSv8uqgeOFnWauuuICyRfgCNbuKUHc5Clijr4uAnJvmW1hw+q2FdVZU+jORHGT4hHqPgCp2d2cJsKzx8GemFy1achvihhhOGisLvDBaGULb3rac9C1n7RUdCEjYCh664uTuBY0DvqmRmKwdCk+/SsEDO2fUESVFE5Zh6VQOZfTXOBtjpPOKgh7e+tBUpBR/BISslUweUNflpH11prSvMjyTklA5jQFR/9rNg=="
		const { response, body } = (await transactions.clearbank) ?? {}
		response?.status != 200 && console.log(`Signer health response: `, JSON.stringify({ ...response, body }, null, 2))
		expect(body).toBe(result)
	})
})
