describe('Agregar tarea', () => {
  it('crea una lista y una tarea dentro del tablero', () => {
    const boardName = `Board ${Date.now()}`;
    cy.createBoard(boardName).then((id) => {
      cy.visit(`/boards/${id}`);

      cy.get('[data-testid="new-list-input"]').type('To Do');
      cy.get('[data-testid="submit-list"]').click();
      cy.contains('[data-testid="list-column"]', 'To Do').should('be.visible');

      cy.get('[data-testid="new-task-input-To Do"]').type('Mi primera tarea');
      cy.get('[data-testid="submit-task-To Do"]').click();

      cy.contains('[data-testid="task-card"]', 'Mi primera tarea').should('be.visible');
    });
  });
});
