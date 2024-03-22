/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/dom"
import "@testing-library/jest-dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import mockedBills from "../__mocks__/store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { bills } from "../fixtures/bills"
import { formatDate } from "../app/format.js"
import router from "../app/Router.js"
import store from "../app/Store.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let root
    beforeEach(() => {
      jest.spyOn(mockedBills, "bills")
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee"
        })
      )
      root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    afterEach(() => {
      if (document.body.contains(root)) {
        document.body.removeChild(root)
      }
    })

    test("Then mail icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId("icon-mail"))
      const mailIcon = screen.getByTestId("icon-mail")

      expect(mailIcon).toHaveClass("active-icon")
    })

    test("Then the page should render correctly", () => {
      document.body.innerHTML = NewBillUI()

      // Assert that the necessary elements are present on the page
      const formNewBill = screen.getByTestId("form-new-bill")
      expect(formNewBill).toBeTruthy()
      const expenseType = screen.getByTestId("expense-type")
      expect(expenseType).toBeTruthy()
      const expenseName = screen.getByTestId("expense-name")
      expect(expenseName).toBeTruthy()
      const datePicker = screen.getByTestId("datepicker")
      expect(datePicker).toBeTruthy()
      const amount = screen.getByTestId("amount")
      expect(amount).toBeTruthy()
      const vat = screen.getByTestId("vat")
      expect(vat).toBeTruthy()
      const pct = screen.getByTestId("pct")
      expect(pct).toBeTruthy()
      const commentary = screen.getByTestId("commentary")
      expect(commentary).toBeTruthy()
      const fileInput = screen.getByTestId("file")
      expect(fileInput).toBeTruthy()
      const button = document.getElementById("btn-send-bill")
      expect(button).toBeTruthy()
    })

    test("Then I should handle file selection correctly", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      })

      const handleChangeFileMock = jest.fn((e) => newBill.handleChangeFile(e))
      const inputUploadFile = screen.getByTestId("file")
      expect(inputUploadFile).toBeTruthy()

      inputUploadFile.addEventListener("change", handleChangeFileMock)
      const fileTypes = ['jpeg', 'jpg', 'png']

      fileTypes.forEach(fileType => {
        const file = new File([`file.${fileType}`], `file.${fileType}`, { type: `image/${fileType}` })
        userEvent.upload(inputUploadFile, file)

        expect(handleChangeFileMock).toHaveBeenCalled()
        expect(inputUploadFile.files[0].name).toBe(`file.${fileType}`)

      })
    })

    test("Throws an error when an invalid file is selected", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({ document, onNavigate, store: null, localStorage })

      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })

      const fileInputs = await screen.findAllByTestId('file')
      const fileInput = fileInputs[0]
      // Trigger the change event
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      newBill.handleChangeFile({
        target: { value: 'test.txt' },
        preventDefault: () => { }
      })

      const errorFile = screen.getByTestId("file-error")
      expect(errorFile).not.toHaveClass('hidden')
      expect(errorFile).toHaveTextContent('Veuillez choisir un fichier de type .jpeg, .jpg ou .png')
    })
  })
})

// Integration test POST
describe("Given I am a user connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let root
    beforeEach(() => {
      jest.spyOn(mockedBills, "bills")
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@billed.com"
        })
      )

      root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    afterEach(() => {
      if (document.body.contains(root)) {
        document.body.removeChild(root)
      }
    })

    // Unit test
    test("Then a bill should be created", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      })

      // jest.spyOn to create a mock function that wraps the original function (mockedBills.bills().create).
      const spyCreate = jest.spyOn(mockedBills.bills(), "create")

      // jest.fn is used to create a standalone mock function.
      const handleSubmitMock = jest.fn((e) => newBill.handleSubmit(e))

      const expenseType = screen.getByTestId("expense-type")
      const expenseName = screen.getByTestId("expense-name")
      const datePicker = screen.getByTestId("datepicker")
      const amount = screen.getByTestId("amount")
      const vat = screen.getByTestId("vat")
      const pct = screen.getByTestId("pct")
      const commentary = screen.getByTestId("commentary")
      const status = "pending"

      userEvent.selectOptions(expenseType, "Services en ligne")
      userEvent.type(expenseName, "Licence Webstorm")
      userEvent.type(datePicker, '2024-03-12')
      userEvent.type(amount, '159')
      userEvent.type(vat, '19')
      userEvent.type(pct, '20')
      userEvent.type(commentary, 'IDE performant')

      const fileInput = screen.getByTestId('file')
      const file = new File(['file content'], 'filename.png', { type: 'image/png' })
      userEvent.upload(fileInput, file)

      const uploadedFile = fileInput.files[0]
      const fileName = uploadedFile.name

      // Mock URL.createObjectURL
      URL.createObjectURL = jest.fn(() => 'mocked object url')
      // Now you can use URL.createObjectURL
      const fileUrl = URL.createObjectURL(uploadedFile)

      const formNewBill = screen.getByTestId("form-new-bill")
      expect(formNewBill).toBeTruthy()
      formNewBill.addEventListener("submit", handleSubmitMock)
      fireEvent.submit(formNewBill)

      expect(handleSubmitMock).toHaveBeenCalled()
      expect(spyCreate).toHaveBeenCalled()
      expect(spyCreate).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: {
          noContentType: true,
        },
      })
    })

    test("Then the bill should be created with errors", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      })

      const consoleErrorSpyCreate = jest.spyOn(console, 'error')

      mockedBills.bills().create = jest.fn(() => Promise.reject(new Error('Erreur de création')))

      const formNewBill = screen.getByTestId("form-new-bill")
      fireEvent.submit(formNewBill)

      await waitFor(() => {
        expect(consoleErrorSpyCreate).toHaveBeenCalled()
        expect(consoleErrorSpyCreate).toHaveBeenCalledWith(new Error('Erreur de création'))
      })

      consoleErrorSpyCreate.mockRestore()
    })

    test("Then the bill should be updated successfully", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      })

      const spyUpdate = jest.spyOn(newBill, 'updateBill')


      newBill.billId = "47qAXb6fIm2zOKkLzMro"

      const acceptedBill = mockedBills.bills('accepted')
      await newBill.updateBill(acceptedBill)

      expect(spyUpdate).toHaveBeenCalled()
      expect(spyUpdate).toHaveBeenCalledWith(acceptedBill)
    })


    test("Then the bill should be updated with errors", async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedBills,
        localStorage: window.localStorage,
      })

      const spyUpdate = jest.spyOn(newBill, 'updateBill')

      newBill.billId = "47qAXb6fIm2zOKkLzMro"

      const refusedBill = mockedBills.bills('refused')

      const formNewBill = screen.getByTestId("form-new-bill")
      fireEvent.submit(formNewBill)

      // Mock the updateBill method to avoid making a real API call
      spyUpdate.mockResolvedValueOnce()

      await expect(newBill.updateBill(refusedBill)).resolves.toEqual(undefined)
      expect(spyUpdate).toHaveBeenCalledWith(refusedBill)

      // Mock an error to test the catch block
      spyUpdate.mockRejectedValueOnce(new Error('Erreur de mise à jour'))

      await expect(newBill.updateBill(refusedBill)).rejects.toThrow('Erreur de mise à jour')
      expect(spyUpdate).toHaveBeenCalledWith(refusedBill)
    })
  })
})