import { Injectable, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';

@Injectable()
export class ProfileGrpcClient implements OnModuleInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  onModuleInit() {
    const pkgDef = loader.loadSync(__dirname + '/../../..//proto/lab_interpreter.proto', {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const desc = (grpc.loadPackageDefinition(pkgDef) as any)['phos']['labs'];
    // Example placeholder: replace with actual Profiles gRPC client
    // this.client = new desc.ProfileService(process.env.PROFILE_GRPC_URL, grpc.credentials.createInsecure());
    this.client = null;
  }
  async getPatientContext(patientId: string): Promise<{ age?: number; sex?: 'male' | 'female' }> {
    // Placeholder stub
    return { age: 42, sex: 'male' };
  }
}


