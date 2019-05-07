exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('users').insert([
        { username: 'user1', email: 'abc@gmail.com', password: '123' },
        { username: 'user2', email: 'abc@yahoo.com', password: '234' },
        { username: 'user3', password: '345' },
      ]);
    });
};
