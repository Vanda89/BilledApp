/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store.js"
import '@testing-library/jest-dom/extend-expect'
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import userEvent from "@testing-library/user-event"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // TEST FIX : check if the highlighted icon to have 'active-icon' when she is the current icon
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


  })
})

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("When I click on the new bill button", () => {
    test("Then it should call the method handleClickNewBill when click on the button", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const newBill = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const handleClickNewBill = jest.fn((event) => newBill.handleClickNewBill(event, bills))
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()

      const modale = screen.getAllByTestId("form-new-bill")
      expect(modale).toBeTruthy()
    })
  })

  describe("When I click on the eye icon", () => {
    test("A modal should open", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      const newBill = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })

      const handleClickIconEye = jest.fn(newBill.handleClickIconEye)

      const iconsEye = screen.getAllByTestId('icon-eye')
      iconsEye.forEach(icon => {
        icon.addEventListener('click', handleClickIconEye)
        fireEvent.click(icon)
        expect(handleClickIconEye).toHaveBeenCalled()
      })

      const modale = screen.getByTestId("modaleFile")
      expect(modale).toBeTruthy()
    })
  })
})


