'use strict';

const { sanitizeEntity } = require('strapi-utils');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const orderTemplate = require('../../../config/email-templates/order')

module.exports = {
  createPaymentIntent: async (ctx) => {
    const { cart } = ctx.request.body;

    //simplifica os dados do carrinho - só os IDs
    const cartGamesIds = await strapi.config.functions.cart.cartGamesIds(cart);

    //pega os jogos
    const games = await strapi.config.functions.cart.cartItems(cartGamesIds);

    if(!games.length) {
      ctx.response.status = 404;
      return {
        error: "No valid games found!"
      };
    }

    const total_in_cents = await strapi.config.functions.cart.total(games);

    if(total_in_cents === 0) {
      return {
        freeGames: true
      };
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total_in_cents,
        currency: "usd",
        metadata: { cart: JSON.stringify(cartGamesIds)}
      });

      return paymentIntent;
    } catch (err) {
      return {
        error: err.raw.message
      }
    }
  },

  create: async (ctx) => {
    //pegar o usuário, jogos, total, paymentIntentId e pagamento (paymentMethod)
    const { cart, paymentIntentId, paymentMethod } = ctx.request.body;

    //pega o usuário
    const token = await strapi.plugins["users-permissions"].services.jwt.getToken(ctx);
    const userId = token.id;
    const userInfo = await strapi.query("user", "users-permissions").findOne({ id: userId });

    //pega os jogos
    //simplifica os dados do carrinho - só os IDs
    const cartGamesIds = await strapi.config.functions.cart.cartGamesIds(cart);
    const games = await strapi.config.functions.cart.cartItems(cartGamesIds);

    const total_in_cents = await strapi.config.functions.cart.total(games);

    //pegar do frontend os valores do paymentMethod
    let paymentInfo;
    if (total_in_cents !== 0) {
      try {
        //recupera as informações do cartão (bandeira, last4...)
        paymentInfo = await stripe.paymentMethods.retrieve(paymentMethod);
      } catch (err) {
        ctx.response.status = 402;
        return { error: err.message }
      }
    }

    //salvar no banco
    const entry = {
      total_in_cents,
      payment_intent_id: paymentIntentId,
      card_brand: paymentInfo?.card?.brand,
      card_last4: paymentInfo?.card?.last4,
      user: userInfo,
      games,
    }

    const entity = await strapi.services.order.create(entry);

    //enviar email da compra p/ o usuário
    await strapi.plugins["email-designer"].services.email.sendTemplatedEmail({
      to: userInfo.email,
      from: 'no-reply@wongames.com'
    },
    { templateId: 2 },
    {
      user: userInfo,
      payment: {
        total: `$ ${total_in_cents / 100}`,
        card_brand: entry.card_brand,
        card_last4: entry.card_last4
      },
      games
    }
    )

    return sanitizeEntity(entity, { model: strapi.models.order })
  }

};
