/* eslint-disable class-methods-use-this */
import { Request, Response } from 'express';
import knex from '../database/connection';

class ItemsController {
  async index(resquest: Request, response: Response) {
    const items = await knex('items').select('*');

    const serializedItems = items.map(item => {
      return {
        id: item.id,
        title: item.title,
        image_url: `http://192.168.0.7:3333/uploads/${item.image}`,
      };
    });

    return response.json(serializedItems);
  }
}

export default ItemsController;
