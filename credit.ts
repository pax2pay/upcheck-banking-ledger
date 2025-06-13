import { gracely } from "gracely"
import { pax2pay } from "@pax2pay/model-banking"
import { http } from "cloudly-http"

export namespace credit {
	export async function applyFor(
		client: pax2pay.Client,
		account: string
	): Promise<pax2pay.Transaction | gracely.Error> {
		const loan: pax2pay.Transaction.Creatable = {
			counterpart: "credit",
			currency: "GBP",
			amount: 100,
			description: "upcheck credit loan",
		}
		const result = client.transactions.create(account, loan)
		console.log("applyFor finished.")
		return result
	}

	export async function settle(): Promise<boolean> {
		let result: boolean
		const date = new Date()
		if (date.getUTCHours() == 10 && date.getMinutes() < 10) {
			const response = await http.fetch("https://credit.paxgiro.com/settlement")
			const body = await response.body
			result =
				Array.isArray(body) &&
				body.every(item => item && typeof item == "object" && "status" in item && typeof item.status == "number")
			!result && console.log("credit settle problem: ", JSON.stringify(body, null, 2))
		} else
			result = true
		return result
	}
}
