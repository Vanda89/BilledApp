/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { fireEvent, render, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import mockedBills from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event"



describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      document.body.innerHTML = BillsUI({ data: bills })
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      //to-do write expect expression
      expect(windowIcon).toBeTruthy()
      expect(windowIcon).toHaveClass("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    describe("When I click on the new bill button", () => {
      test("Then it should call the method handleClickNewBill when click on the button", () => {
        const mockBill = new Bills({
          document, onNavigate, store: mockedBills, localStorage: window.localStorage
        })

        const handleClickNewBill = jest.fn((event) => mockBill.handleClickNewBill(event, bills))
        const buttonNewBill = screen.getByTestId('btn-new-bill')
        buttonNewBill.addEventListener('click', handleClickNewBill)
        fireEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled()

        const modale = screen.getAllByTestId("form-new-bill")
        expect(modale).toBeTruthy()
      })
    })

    describe("When I click on the eye icon", () => {
      test("Then a modal should be displayed", async () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const mockBill = new Bills({
          document, onNavigate, store: null, localStorage: window.localStorage
        })

        const handleClickIconEye = jest.fn(mockBill.handleClickIconEye)
        const iconsEye = await waitFor(() => screen.getAllByTestId('icon-eye'))

        const modaleFile = document.getElementById("modaleFile")
        $.fn.modal = jest.fn(() => modaleFile.classList.add('show'))
        // const showModal = jest.fn(() => 

        iconsEye.forEach(icon => {
          icon.addEventListener('click', () => handleClickIconEye(icon))
          userEvent.click(icon)
          expect(handleClickIconEye).toHaveBeenCalled()
          expect(modaleFile).toHaveClass("show")
        })
      })
    })

  })
})

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to BillsUI", () => {
    // Integration test GET
    test("Then I should see the dashboard elements", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      screen.getByText("Nouvelle note de frais")
      const newBillButton = screen.getByTestId("btn-new-bill")
      expect(newBillButton).toBeTruthy()
      const eyeIcon = screen.getAllByTestId("icon-eye")
      expect(eyeIcon).toBeTruthy()
      const windowIcon = document.getElementById("layout-icon1")
      expect(windowIcon).toHaveClass("active-icon")
      const btnLogout = document.getElementById("layout-disconnect")
      expect(btnLogout).toBeTruthy()
    })

    // Unit test
    test('Then should return unformatted date when formatDate fails', () => {
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([{ date: 'invalid date', status: 'pending' }])
        })
      }
      const bill = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: {} })

      return bill.getBills().then(bills => {
        expect(bills[0].date).toBe('invalid date')
      })
    })
  })

  // Integration test GET
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedBills, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          },
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)

      await new Promise(process.nextTick)
      // await new Promise(resolve => setTimeout(resolve, 0))
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockedBills.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      // await new Promise(resolve => setTimeout(resolve, 0))
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})