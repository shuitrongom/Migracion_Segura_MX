import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TramitesService } from './tramites.service';
import { Tramite } from './entities/tramite.entity';
import { EtapaTramite } from './entities/etapa-tramite.entity';
import { TareaInterna } from './entities/tarea-interna.entity';
import { PlantillaProceso } from './entities/plantilla-proceso.entity';
import { EstatusTramite, TipoTramite } from '../../common/enums';

describe('TramitesService', () => {
  let service: TramitesService;
  let tramiteRepository: Record<string, jest.Mock>;
  let etapaRepository: Record<string, jest.Mock>;
  let tareaInternaRepository: Record<string, jest.Mock>;
  let plantillaRepository: Record<string, jest.Mock>;

  const mockTramite = {
    id: 'tramite-uuid-1',
    clienteId: 'cliente-uuid-1',
    tipo: TipoTramite.RESIDENCIA_TEMPORAL,
    estatus: EstatusTramite.BORRADOR,
    numeroPieza: null as string | null,
    asesorId: null,
    responsableId: null,
    datosFormulario: null as Record<string, unknown> | null,
    fechaCierre: null as Date | null,
    resolucion: null as string | null,
    comprobanteUrl: null,
    etapas: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const createQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
    };

    tramiteRepository = {
      create: jest.fn().mockImplementation((data) => ({ ...mockTramite, ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockTramite, ...entity })),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder),
      query: jest.fn().mockResolvedValue(undefined),
    };

    etapaRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    tareaInternaRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
      }),
    };

    plantillaRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TramitesService,
        { provide: getRepositoryToken(Tramite), useValue: tramiteRepository },
        { provide: getRepositoryToken(EtapaTramite), useValue: etapaRepository },
        { provide: getRepositoryToken(TareaInterna), useValue: tareaInternaRepository },
        { provide: getRepositoryToken(PlantillaProceso), useValue: plantillaRepository },
      ],
    }).compile();

    service = module.get<TramitesService>(TramitesService);
  });

  describe('create', () => {
    it('should create a tramite with RECIBIDO status and generate numero de pieza', async () => {
      const savedTramite = {
        ...mockTramite,
        id: 'new-tramite-id',
        estatus: EstatusTramite.RECIBIDO,
        numeroPieza: 'MSX-2024-000001',
      };

      tramiteRepository.save.mockResolvedValue(savedTramite);
      tramiteRepository.findOne.mockResolvedValue(savedTramite);

      const result = await service.create({
        clienteId: 'cliente-uuid-1',
        tipo: TipoTramite.RESIDENCIA_TEMPORAL,
        esBorrador: false,
      });

      expect(result.estatus).toBe(EstatusTramite.RECIBIDO);
      expect(tramiteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clienteId: 'cliente-uuid-1',
          tipo: TipoTramite.RESIDENCIA_TEMPORAL,
          estatus: EstatusTramite.RECIBIDO,
        }),
      );
    });

    it('should create a borrador tramite without numero de pieza', async () => {
      const savedBorrador = {
        ...mockTramite,
        id: 'borrador-id',
        estatus: EstatusTramite.BORRADOR,
        numeroPieza: null,
      };

      tramiteRepository.save.mockResolvedValue(savedBorrador);
      tramiteRepository.findOne.mockResolvedValue(savedBorrador);

      const result = await service.create({
        clienteId: 'cliente-uuid-1',
        tipo: TipoTramite.VISA,
        esBorrador: true,
      });

      expect(result.estatus).toBe(EstatusTramite.BORRADOR);
      expect(result.numeroPieza).toBeNull();
      expect(tramiteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: EstatusTramite.BORRADOR,
          numeroPieza: null,
        }),
      );
    });
  });

  describe('saveDraft', () => {
    it('should save form data when tramite is in borrador status', async () => {
      const borradorTramite = { ...mockTramite, estatus: EstatusTramite.BORRADOR };
      tramiteRepository.findOne.mockResolvedValue(borradorTramite);

      const formData = { nombreCompleto: 'Juan Pérez', nacionalidad: 'Colombiana' };
      const savedTramite = { ...borradorTramite, datosFormulario: formData };
      tramiteRepository.save.mockResolvedValue(savedTramite);

      const result = await service.saveDraft('tramite-uuid-1', formData);

      expect(result.datosFormulario).toEqual(formData);
      expect(tramiteRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when tramite is not in borrador status', async () => {
      const recibidoTramite = { ...mockTramite, estatus: EstatusTramite.RECIBIDO };
      tramiteRepository.findOne.mockResolvedValue(recibidoTramite);

      await expect(
        service.saveDraft('tramite-uuid-1', { campo: 'valor' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when tramite does not exist', async () => {
      tramiteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.saveDraft('nonexistent-id', { campo: 'valor' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEstatus', () => {
    it('should change the estatus of a tramite', async () => {
      const tramite = { ...mockTramite, estatus: EstatusTramite.RECIBIDO };
      tramiteRepository.findOne.mockResolvedValue(tramite);

      const updatedTramite = { ...tramite, estatus: EstatusTramite.EN_REVISION };
      tramiteRepository.save.mockResolvedValue(updatedTramite);

      const result = await service.updateEstatus('tramite-uuid-1', {
        estatus: EstatusTramite.EN_REVISION,
      });

      expect(result.estatus).toBe(EstatusTramite.EN_REVISION);
    });

    it('should set fechaCierre when status is APROBADO', async () => {
      const tramite = { ...mockTramite, estatus: EstatusTramite.EN_REVISION };
      tramiteRepository.findOne.mockResolvedValue(tramite);

      tramiteRepository.save.mockImplementation(async (entity: any) => ({
        ...tramite,
        ...entity,
      }));

      const result = await service.updateEstatus('tramite-uuid-1', {
        estatus: EstatusTramite.APROBADO,
      });

      expect(result.estatus).toBe(EstatusTramite.APROBADO);
      expect(result.fechaCierre).toBeInstanceOf(Date);
    });

    it('should set fechaCierre when status is RECHAZADO', async () => {
      const tramite = { ...mockTramite, estatus: EstatusTramite.EN_REVISION };
      tramiteRepository.findOne.mockResolvedValue(tramite);

      tramiteRepository.save.mockImplementation(async (entity: any) => ({
        ...tramite,
        ...entity,
      }));

      const result = await service.updateEstatus('tramite-uuid-1', {
        estatus: EstatusTramite.RECHAZADO,
        resolucion: 'Documentos incompletos',
      });

      expect(result.estatus).toBe(EstatusTramite.RECHAZADO);
      expect(result.fechaCierre).toBeInstanceOf(Date);
      expect(result.resolucion).toBe('Documentos incompletos');
    });

    it('should throw NotFoundException when tramite does not exist', async () => {
      tramiteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEstatus('nonexistent-id', { estatus: EstatusTramite.EN_REVISION }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitDraft', () => {
    it('should change borrador to recibido and generate numero de pieza', async () => {
      const borrador = { ...mockTramite, estatus: EstatusTramite.BORRADOR };
      tramiteRepository.findOne.mockResolvedValue(borrador);

      tramiteRepository.save.mockImplementation(async (entity: any) => ({
        ...borrador,
        ...entity,
        numeroPieza: 'MSX-2024-000001',
      }));

      const result = await service.submitDraft('tramite-uuid-1');

      expect(result.estatus).toBe(EstatusTramite.RECIBIDO);
      expect(result.numeroPieza).toBeTruthy();
    });

    it('should throw BadRequestException if tramite is not borrador', async () => {
      const recibido = { ...mockTramite, estatus: EstatusTramite.RECIBIDO };
      tramiteRepository.findOne.mockResolvedValue(recibido);

      await expect(service.submitDraft('tramite-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
