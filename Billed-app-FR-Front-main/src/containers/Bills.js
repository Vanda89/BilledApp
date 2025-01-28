import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill)
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon))
    })
    new Logout({ document, localStorage, onNavigate })
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url")
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`)
    $('#modaleFile').modal('show')
  }

  getBills = () => {
    if (this.store) {
      return this.store.bills().list()
        .then(bills => this.formatBills(bills))
        .catch(error => {
          console.error("Error fetching bills:", error);
        });
    } else {
      // On peut mocker le fetch API pour les tests
      return fetch(`${process.env.API_URL}/bills`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') // Si tu utilises un token pour l'authentification
        }
      })
        .then(response => response.json())
        .then(bills => this.formatBills(bills))
        .catch(error => {
          console.error("Error fetching bills:", error);
        });
    }
  }
  
  formatBills = (bills) => {
    return bills.map(bill => {
      try {
        return {
          ...bill,
          date: formatDate(bill.date),
          status: formatStatus(bill.status),
        };
      } catch (e) {
        console.log(e, 'for', bill);
        return {
          ...bill,
          date: bill.date,
          status: formatStatus(bill.status),
        };
      }
    });
  }
  
}
