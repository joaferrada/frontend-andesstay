import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const msalServiceMock = {
    instance: {
      handleRedirectPromise: () => Promise.resolve(null),
      getActiveAccount: () => null,
      getAllAccounts: () => [],
      setActiveAccount: () => undefined
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: MsalService, useValue: msalServiceMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
