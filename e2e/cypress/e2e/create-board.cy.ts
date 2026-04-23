describe('Crear tablero', () => {
  it('crea un tablero y lo muestra en el listado', () => {
    const name = `Board ${Date.now()}`;
    cy.visit('/');
    cy.get('[data-testid="new-board-btn"]').click();
    cy.get('[data-testid="board-name-input"]').type(name);
    cy.get('[data-testid="submit-board"]').click();
    cy.contains('[data-testid="board-card"]', name).should('be.visible');
  });
});
