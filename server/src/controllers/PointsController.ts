/* eslint-disable class-methods-use-this */
import { Request, Response, request } from 'express';
import knex from '../database/connection';

class PointsController {
  async index(resquest: Request, response: Response) {
    const { city, uf, items } = resquest.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    const serializedPoint = points.map(point => {
      return {
        ...points,
        image_url: `http://192.168.0.7:3333/uploads/${point.image}`,
      };
    });

    return response.json(serializedPoint);
  }

  async show(resquest: Request, response: Response) {
    const { id } = resquest.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ error: 'Point not found.' });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.0.7:3333/uploads/${point.image}`,
    };

    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title');

    return response.json({ serializedPoint, items });
  }

  async create(resquest: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = resquest.body;

    const trx = await knex.transaction();

    const point = {
      image: resquest.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const insertedIds = await trx('points').insert(point);

    const point_id = insertedIds[0];

    const pointItem = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id,
        };
      });

    await trx('point_items').insert(pointItem);

    await trx.commit();

    return response.json({
      id: point_id,
      ...point,
    });
  }
}

export default PointsController;
