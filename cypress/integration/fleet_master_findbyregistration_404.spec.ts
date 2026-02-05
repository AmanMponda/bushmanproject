describe('Fleet Master - registration lookup 404 handling', () => {
  it('keeps the list view and does not crash when find-by-registration returns 404', () => {
    cy.intercept('GET', '**/vehicle-assets/display**', {
      statusCode: 200,
      body: { success: true, data: [{ id: 1, registration_number: 'REG123', name: 'Test Vehicle' }] }
    }).as('listVehicles')

    cy.intercept('GET', '**/vehicle-assets/find-by-registration**', {
      statusCode: 404,
      body: { success: false, message: 'Vehicle asset not found with the given registration number' }
    }).as('findByRegistration')

    cy.visit('/#/bushman/assets/fleet-master/1')

    cy.wait('@listVehicles')
    cy.wait('@findByRegistration')

    cy.get('.fleet-master-list').should('exist')
    cy.get('.vehicle-profile-shell').should('not.exist')
  })
})