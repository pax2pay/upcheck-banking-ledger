import { gracely } from "gracely"
import "isomorphic-fetch"
import { pax2pay } from "@pax2pay/model-banking"
import { Balances } from "./Balances"
import { credit } from "./credit"
import { Ledger } from "./Ledger"

jest.setTimeout(20000)
let ledger: Ledger | undefined
let transactions: Record<"internal" | "paxgiro" | "credit" | "clearbank", any>
describe("pax2pay Ledger", () => {
	beforeAll(async () => {
		ledger = await Ledger.open()
		transactions = await Promise.all([
			ledger?.createInternal(),
			ledger?.createPaxgiro(),
			ledger?.client ? credit.applyFor(ledger?.client, "hJJ5AD-y") : undefined,
			ledger?.clearbankHealth(),
		]).then(t => ({ internal: t[0], paxgiro: t[1], credit: t[2], clearbank: t[3] }))
	})
	it("create internal", async () => {
		const internal = transactions.internal
		const is =
			pax2pay.Transaction.is(internal) &&
			(internal.status == "review" || internal.status == "created" || internal.status == "processing")
		expect(is).toBeTruthy()
		!is && console.log("internal: ", JSON.stringify(internal, null, 2))
	})
	it("create paxgiro", async () => {
		const paxgiro = transactions.paxgiro
		const is =
			pax2pay.Transaction.is(paxgiro) &&
			(paxgiro.status == "review" || paxgiro.status == "created" || paxgiro.status == "processing")
		expect(is).toBeTruthy()
		!is && console.log("paxgiro: ", JSON.stringify(paxgiro, null, 2))
	})
	it("total balance constant", async () => {
		const accounts = await ledger?.accounts
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
	it("Clearbank signer health", async () => {
		const result =
			"EosDcM8deXNQb/5VGBpG1nA46t66zxWgYuSMJFAxjPyADcxHOmIP9ImkK+X3yZkPBx1TEeDijaytk1MouWQo85RHxd4N9LHKOrNaUqdZLsnjIH6E0hMSv8uqgeOFnWauuuICyRfgCNbuKUHc5Clijr4uAnJvmW1hw+q2FdVZU+jORHGT4hHqPgCp2d2cJsKzx8GemFy1achvihhhOGisLvDBaGULb3rac9C1n7RUdCEjYCh664uTuBY0DvqmRmKwdCk+/SsEDO2fUESVFE5Zh6VQOZfTXOBtjpPOKgh7e+tBUpBR/BISslUweUNflpH11prSvMjyTklA5jQFR/9rNg=="
		const { response, body } = (await transactions.clearbank) ?? {}
		response?.status != 200 && console.log(`Signer health response: `, JSON.stringify({ ...response, body }, null, 2))
		expect(body).toBe(result)
	})
	it("credit", async () => {
		const transaction = transactions.credit
		const is = pax2pay.Transaction.is(transaction)
		!is && console.log("credit transaction error: ", transaction)
		expect(is).toBe(true)
	})
	it("settle credit", async () => {
		expect(await credit.settle()).toBe(true)
	})
})
