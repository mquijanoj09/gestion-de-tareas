/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      createBoard(name: string): Chainable<string>;
    }
  }
}

Cypress.Commands.add('createBoard', (name: string) => {
  cy.request('POST', '/api/boards', { name }).then((res) => res.body.id as string);
});

export {};
