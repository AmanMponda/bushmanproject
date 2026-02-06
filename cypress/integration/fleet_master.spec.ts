describe('Fleet Master deep-linking & details view', () => {
  it('opens details and updates URL to /fleet-master/:id when View Details is clicked', () => {
    // Intercept list and single-vehicle endpoints
    cy.intercept('GET', '**/vehicle-assets/display**', {
      statusCode: 200,
      body: { success: true, data: [{ id: 1, registration_number: 'REG123', name: 'Test Vehicle' }] }
    }).as('listVehicles')

    cy.intercept('GET', '**/vehicle-assets/1', {
      statusCode: 200,
      body: { success: true, data: { id: 1, registration_number: 'REG123', name: 'Test Vehicle' } }
    }).as('getVehicle')

    cy.visit('/#/bushman/assets/fleet-master')

    cy.wait('@listVehicles')

    // Click the first 'View Details' button in the table
    cy.get('button[title="View Details"]').first().click()

    cy.wait('@getVehicle')

    // URL should include the pretty id route
    cy.hash().should('include', '/bushman/assets/fleet-master/REG123')

    // The details shell should be visible
    cy.get('.vehicle-profile-shell').should('be.visible')
  })
})
