describe('Fleet Master - registration not found behavior', () => {
  it('stays on list and shows no details when registration lookup returns success:false', () => {
    // Intercept the initial list call to show at least one vehicle
    cy.intercept('GET', '**/vehicle-assets/display**', {
      statusCode: 200,
      body: { success: true, data: [{ id: 1, registration_number: 'REG123', name: 'Test Vehicle' }] }
    }).as('listVehicles')

    // Intercept direct find-by-registration call to return success:false
    cy.intercept('GET', '**/vehicle-assets/find-by-registration**', {
      statusCode: 200,
      body: { success: false, message: 'Vehicle asset not found with the given registration number' }
    }).as('findByRegistration')

    // Visit pretty-route that will trigger auto-open logic on mount
    cy.visit('/#/bushman/assets/fleet-master/NOTEXIST')

    // Wait for list fetch
    cy.wait('@listVehicles')

    // The findByRegistration should be called due to the route param
    cy.wait('@findByRegistration')

    // Ensure list view is visible (not details shell)
    cy.get('.fleet-master-list').should('exist')
    cy.get('.vehicle-profile-shell').should('not.exist')
  })
})