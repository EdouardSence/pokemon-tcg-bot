const sql = require("./db");

const getAllMatchings = async () => {
  const matchings = await sql`
        SELECT 
        m.id_matching,
        m.id_user1,
        m.id_user2,
        m.id_card_user1_receive,
        m.id_card_user2_receive,
        m.user1_validate_trade,
        m.user2_validate_trade,
        m.error_raison,
        m.trade_success,
        m.user1_message_id,
        m.user2_message_id
        FROM 
        matching m
    `;
  return matchings;
};

const getMatchingById = async (id) => {
  const matchings = await sql`
        SELECT 
        m.id_matching,
        m.id_user1,
        m.id_user2,
        m.id_card_user1_receive,
        m.id_card_user2_receive,
        m.user1_validate_trade,
        m.user2_validate_trade,
        m.error_raison,
        m.trade_success,
        m.user1_message_id,
        m.user2_message_id
        FROM 
        matching m
        WHERE m.id_matching = ${id}
    `;
  return matchings;
};

const deleteMatching = async (id) => {
  const matchings = await sql`
        DELETE FROM matching WHERE id_matching = ${id}
    `;
  return matchings;
};
const updateMatchingValidateUser1 = async (id, user_validate_trade) => {
  const updatedMatching = await sql`
      UPDATE matching
      SET user1_validate_trade = ${user_validate_trade}
      WHERE id_matching = ${id}
      RETURNING *
    `;
  return updatedMatching[0];
};

const updateMatchingValidateUser2 = async (id, user_validate_trade) => {
  const updatedMatching = await sql`
      UPDATE matching
      SET user2_validate_trade = ${user_validate_trade}
      WHERE id_matching = ${id}
      RETURNING *
    `;
  return updatedMatching[0];
};

const updateMatchingSuccess = async (id) => {
  const updatedMatching = await sql`
                UPDATE matching
                SET 
                    trade_success = true
                WHERE id_matching = ${id}
                RETURNING *
        `;
  return updatedMatching[0];
};

const updateMatchingError = async (id, error_raison) => {
  const updatedMatching = await sql`
                UPDATE matching
                SET 
                    trade_success = false,
                    error_raison = ${error_raison}
                WHERE id_matching = ${id}
                RETURNING *
        `;
  return updatedMatching[0];
}

const updateMatchingMessages = async (id, user1_message_id,user2_message_id) => {
  const updatedMatching = await sql`
        UPDATE matching
        SET 
            user1_message_id = ${user1_message_id},
            user2_message_id = ${user2_message_id}
        WHERE id_matching = ${id}
        RETURNING *
    `;
  return updatedMatching[0];
}

module.exports = {
  getAllMatchings,
  getMatchingById,
  deleteMatching,
  updateMatchingValidateUser1,
  updateMatchingValidateUser2,
  updateMatchingMessages,
  updateMatchingSuccess,
  updateMatchingError,
};
