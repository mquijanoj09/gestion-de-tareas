describe('Mover tarea entre listas', () => {
  it('mueve una tarea de To Do a Done vía drag & drop', () => {
    const boardName = `Board ${Date.now()}`;
    cy.createBoard(boardName).then((boardId) => {
      cy.request('POST', `/api/boards/${boardId}/lists`, { name: 'To Do' }).then((r1) => {
        const todoId = r1.body.id as string;
        cy.request('POST', `/api/boards/${boardId}/lists`, { name: 'Done' }).then(() => {
          cy.request('POST', `/api/lists/${todoId}/tasks`, { title: 'Tarea a mover' }).then(() => {
            cy.visit(`/boards/${boardId}`);

            cy.contains('[data-testid="task-card"]', 'Tarea a mover').as('card');
            cy.contains('[data-testid="list-column"]', 'Done').as('doneCol');

            cy.get('@card').realMouseDown({ position: 'center' });
            cy.get('@card').realMouseMove(10, 10, { position: 'center' });
            cy.get('@doneCol').realMouseMove(20, 40, { position: 'center' });
            cy.get('@doneCol').realMouseUp();

            cy.get('@doneCol').contains('[data-testid="task-card"]', 'Tarea a mover').should(
              'be.visible',
            );
          });
        });
      });
    });
  });
});
